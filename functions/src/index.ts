import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

export { sendInvite, acceptInvite } from './invites';
export { livekitToken } from './livekitToken';
export { onMessageCreate, onCallCreated } from './notifications';
export { dailyBirthdayJob } from './birthdays';
