//nice to use when this repeating across the app
//in this case you only change the messages here
//it will be updated automatically across the app
// app.constant('AUTH_EVENTS',{
//     loginSuccess: 'auth-login-success',
//     loginFailed: 'auth-login-failed',
//     logoutSuccess: 'auth-logout-success',
//     sessionTimeout: 'auth-session-timeout',
//     notAuthenticated: 'auth-not-authenticated',
//     notAuthorized: 'auth-not-authorized'
// });
// app.constant('USER_ROLES', {
//   all: '*',
//   user: 'user'
// })
var AUTH_EVENTS = {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
};
module.exports = AUTH_EVENTS;

// module.exports = USER_ROLES {
//   all: '*',
//   user: 'user'
// };
