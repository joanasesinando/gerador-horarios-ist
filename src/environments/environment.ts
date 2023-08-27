import packageInfo from '../../package.json';
import {secrets} from './secrets';

export const environment = {
  production: false,
  projectVersion: packageInfo.version,
  googleAnalytics: secrets.googleAnalytics,
  googleScript: secrets.googleScript
};
