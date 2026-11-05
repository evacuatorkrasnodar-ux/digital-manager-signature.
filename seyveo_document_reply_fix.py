from pathlib import Path
from datetime import datetime
import shutil

root = Path(__file__).resolve().parent
target = root / 'sayvi-chat-new.html'
if not target.is_file():
    raise SystemExit('ERROR: sayvi-chat-new.html not found next to this script.')
content = target.read_text(encoding='utf-8')
old = 'prepareAttachments(selected,Math.max(0,3550-value.length))'
new = 'prepareAttachments(selected,Math.max(0,3000-value.length))'
if new in content:
    print('ALREADY INSTALLED: Document message size is limited.')
    raise SystemExit(0)
if content.count(old) != 1:
    raise SystemExit('ERROR: Expected document send code not found. No changes made.')
updated = content.replace(old, new, 1)
backup = target.with_name(target.name + '.backup-document-reply-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
shutil.copy2(target, backup)
try:
    target.write_text(updated, encoding='utf-8')
except Exception:
    shutil.copy2(backup, target)
    raise
print('SUCCESS: Document reply size fix installed.')
print('Backup saved:', backup.name)
print('Updated:', target.name)
print('Next: GitHub Desktop -> Commit to main -> Push origin -> restart local server.')
