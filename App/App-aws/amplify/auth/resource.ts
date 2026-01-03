// import { defineAuth } from '@aws-amplify/backend';

// /**
//  * Define and configure your auth resource
//  * @see https://docs.amplify.aws/gen2/build-a-backend/auth
//  */
// export const auth = defineAuth({
//   loginWith: {
//     email: true,
//   },
// });
import { defineAuth } from "@aws-amplify/backend";
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    phoneNumber: {
      required: false,
      mutable: true,
    },
    profilePicture: {
      required: false,
      mutable: true,
    },
    "custom:userType": {
      dataType: "String",
      mutable: true,
    },
    "custom:parentId": {
      dataType: "String",
      mutable: true,
    },
    "custom:childIds": {
      dataType: "String",
      mutable: true,
    },
    "custom:familyCode": {
      dataType: "String",
      mutable: true,
    },
    "custom:trustedContacts": {
      dataType: "String",
      mutable: true,
    },
  },
  groups: ["Parents", "Children"],
});
