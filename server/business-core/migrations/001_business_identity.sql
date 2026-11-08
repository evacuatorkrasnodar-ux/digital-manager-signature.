-- SEYVEO Business · first server-side identity and organization schema.
-- PostgreSQL >= 14. Schema only: NOT an operating production service.
-- Apply via a migration runner with restricted DB credentials and review.
-- External authentication provider must verify identities before any insert.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS seyveo_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_issuer text NOT NULL CHECK (length(auth_issuer) BETWEEN 1 AND 255),
  auth_subject text NOT NULL CHECK (length(auth_subject) BETWEEN 1 AND 255),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auth_issuer, auth_subject)
);

CREATE TABLE IF NOT EXISTS seyveo_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 180),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seyveo_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES seyveo_organizations(id) ON DELETE RESTRICT,
  code text NOT NULL CHECK (length(code) BETWEEN 1 AND 80),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 180),
  UNIQUE (organization_id, code),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS seyveo_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  code text NOT NULL CHECK (length(code) BETWEEN 1 AND 80),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 180),
  FOREIGN KEY (branch_id,organization_id)
    REFERENCES seyveo_branches(id,organization_id) ON DELETE RESTRICT,
  UNIQUE (id, organization_id, branch_id),
  UNIQUE (organization_id, branch_id, code)
);

CREATE TABLE IF NOT EXISTS seyveo_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES seyveo_organizations(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES seyveo_users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (organization_id, user_id),
  UNIQUE (id, organization_id),
  CHECK (status <> 'revoked' OR revoked_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS seyveo_role_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN
    ('owner','org_admin','hr','accountant','lawyer','store_manager','assistant','employee')),
  branch_id uuid,
  department_id uuid,
  granted_by_membership_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (membership_id,organization_id)
    REFERENCES seyveo_memberships(id,organization_id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by_membership_id,organization_id)
    REFERENCES seyveo_memberships(id,organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id,organization_id)
    REFERENCES seyveo_branches(id,organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id,organization_id,branch_id)
    REFERENCES seyveo_departments(id,organization_id,branch_id) ON DELETE RESTRICT,
  CHECK (department_id IS NULL OR branch_id IS NOT NULL),
  CHECK (role NOT IN ('store_manager','assistant','employee') OR branch_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS seyveo_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES seyveo_organizations(id) ON DELETE RESTRICT,
  -- A salted/HMAC-based normalized contact verifier or verified recipient ID;
  -- NOT an unkeyed hash of low-entropy telephone/email values.
  recipient_contact_verifier bytea,
  recipient_user_id uuid REFERENCES seyveo_users(id) ON DELETE RESTRICT,
  token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash)=32),
  invited_role text NOT NULL CHECK (invited_role IN
    ('org_admin','hr','accountant','lawyer','store_manager','assistant','employee')),
  branch_id uuid,
  department_id uuid,
  issued_by_membership_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','revoked','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  decided_at timestamptz,
  accepted_by_membership_id uuid,
  FOREIGN KEY (issued_by_membership_id,organization_id)
    REFERENCES seyveo_memberships(id,organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (accepted_by_membership_id,organization_id)
    REFERENCES seyveo_memberships(id,organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id,organization_id)
    REFERENCES seyveo_branches(id,organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id,organization_id,branch_id)
    REFERENCES seyveo_departments(id,organization_id,branch_id) ON DELETE RESTRICT,
  CHECK (recipient_contact_verifier IS NOT NULL OR recipient_user_id IS NOT NULL),
  CHECK (department_id IS NULL OR branch_id IS NOT NULL),
  CHECK (invited_role NOT IN ('store_manager','assistant','employee') OR branch_id IS NOT NULL),
  CHECK (expires_at>created_at),
  CHECK (status='pending' OR decided_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS seyveo_pending_invites_lookup
  ON seyveo_invitations (organization_id, expires_at)
  WHERE status='pending';
CREATE INDEX IF NOT EXISTS seyveo_role_grants_by_member
  ON seyveo_role_grants (organization_id, membership_id);
CREATE INDEX IF NOT EXISTS seyveo_memberships_by_user
  ON seyveo_memberships (user_id, status);

CREATE TABLE IF NOT EXISTS seyveo_business_audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES seyveo_organizations(id) ON DELETE RESTRICT,
  actor_user_id uuid REFERENCES seyveo_users(id) ON DELETE RESTRICT,
  subject_user_id uuid REFERENCES seyveo_users(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (length(action) BETWEEN 1 AND 100),
  target_type text NOT NULL CHECK (length(target_type) BETWEEN 1 AND 60),
  target_id uuid,
  outcome text NOT NULL CHECK (outcome IN ('allowed','denied','error')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seyveo_audit_by_org_time
  ON seyveo_business_audit_events(organization_id,occurred_at DESC);

-- No GRANTs to app users here. Production implementation must use separate
-- least-privilege DB credentials, transaction-level tenant context and RLS
-- as defense-in-depth. Every API MUST enforce authenticated org membership.
-- Invitation acceptance must atomically consume the token, verify identity,
-- check invitation expiry/status, create/update membership and role grants,
-- and append audit events before commit (with replay-safe idempotence).
