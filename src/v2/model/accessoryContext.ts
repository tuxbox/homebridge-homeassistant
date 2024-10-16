export type AccessoryContext<PersistedState, Configuration> = {

  __persisted_state : PersistedState | undefined;
  configuration: Configuration;

};
