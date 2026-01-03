import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'careNestStorage',
  access: (allow) => ({
    'profile-photos/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'location-data/*': [
      allow.authenticated.to(['read', 'write'])
    ],
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});