module.exports = {
  flowFile: "flows.json",
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET,
  httpAdminRoot: '/admin',
  // adminAuth: {
  //   type: "credentials",
  //   users: [{
  //     username: "admin",
  //     password: "...",
  //     permissions: "*"
  //   }]
  // },
  functionExternalModules: true,
  functionGlobalContext: {},
  editorTheme: {
    projects: {
      enabled: false
    }
  }
};
