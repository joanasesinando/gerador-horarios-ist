import packageInfo from '../../package.json';
import {secrets} from './secrets';

export const environment = {
  production: true,
  projectVersion: packageInfo.version,
  googleAnalytics: secrets.googleAnalytics
};
