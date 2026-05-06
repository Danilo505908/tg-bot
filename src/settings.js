const birthdayBot = require("./lib/bot");
const birthdayReminders = require("./lib/reminders");

module.exports = {
  flowFile: "flows.json",
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET,
  httpAdminRoot: '/admin',
  adminAuth: {
    type: "credentials",
    users: [{
      username: "admin",
      password: "$2y$08$hy9/DTbDgJthOos0wYMjq.7.YYLyvqfXA6rrd02FQLOaUo9KpoAZa",
      permissions: "*"
    }]
  },
  functionExternalModules: true,
  functionGlobalContext: {
    birthdayBot,
    birthdayReminders
  },
  editorTheme: {
    projects: {
      enabled: false
    }
  }
};
