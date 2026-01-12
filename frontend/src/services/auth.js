import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_vmMUqSwXC',
  ClientId: '17vf8h3pifmkbht0n9gedkaam8'
};
const userPool = new CognitoUserPool(poolData);

export function login(email, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.authenticateUser(new AuthenticationDetails({ Username: email, Password: password }), {
      onSuccess: (result) => {
        const userData = { email };
        localStorage.setItem('token', result.getAccessToken().getJwtToken());
        localStorage.setItem('user', JSON.stringify(userData));
        resolve(userData);
      },
      onFailure: reject
    });
  });
}

export function register(email, password) {
  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, [{ Name: 'email', Value: email }], null, async (err, result) => {
      if (err) {
        reject(err);
      } else {
        // Auto-confirm prin API
        try {
          const response = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-amz-json-1.1',
              'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp'
            },
            body: JSON.stringify({
              UserPoolId: 'us-east-1_Cin2ct9cD',
              Username: email
            })
          });
        } catch (e) {
          // Ignore - user poate confirma manual
        }
        resolve(result);
      }
    });
  });
}

export function getToken() { return localStorage.getItem('token'); }
export function logout() { 
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
