// A model is ready only after native inference has completed a probe.
export function localModelReady(status){
 return status?.installed===true &&
  status?.integrityVerified===true &&
  status?.runtimeLoaded===true &&
  status?.probeSucceeded===true;
}
