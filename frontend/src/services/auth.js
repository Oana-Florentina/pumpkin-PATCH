import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_Cin2ct9cD',
  ClientId: '2m43iktlg1prp1hdf4poemjtfb'
};
const userPool = new CognitoUserPool(poolData);

export function login(email, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.authenticateUser(new AuthenticationDetails({ Username: email, Password: password }), {
      onSuccess: (result) => {
        localStorage.setItem('token', result.getAccessToken().getJwtToken());
        resolve({ email });
      },
      onFailure: reject
    });
  });
}

export function getToken() { return localStorage.getItem('token'); }
export function logout() { localStorage.removeItem('token'); }
