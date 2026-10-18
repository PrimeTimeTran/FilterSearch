export const GENDER_CANDIDATES = {
  male: ['male', 'm', 'man', 'he', 'he/him', 'masculine'],
  female: ['female', 'f', 'woman', 'she', 'she/her', 'feminine'],
}

export const IDENTIFY_AS_MAP = {
  cisgender: ['Cisgender', 'cis', 'cis gender'],
  transgender: ['transgender', 'trans', 'trans gender'],
  nonbinary: ['non-binary', 'nonbinary', 'genderqueer', 'nb'],
}

export const SEXUAL_ORIENTATION_MAP = {
  asexual: ['Asexual', 'ace'],
  heterosexual: ['straight', 'heterosexual'],
  homosexual: ['gay', 'lesbian', 'homosexual'],
  bisexual: ['bisexual', 'bi'],
  pansexual: ['pansexual', 'pan'],
  other: ['other', 'prefer not to say'],
}

export const VETERAN_STATUS_MAP = {
  no: [
    'No',
    'Not a protected veteran',
    'I am not a protected veteran',
    'No, I am not a veteran',
    'No, I am not a protected veteran',
  ],
  yes: ['Yes', 'Yes, I am a protected veteran', 'protected veteran'],
}

export const DISABILITY_MAP = {
  yes: [
    'yes, i have a disability',
    'yes i have a disability',
    'yes',
    'i have a disability',
    'i am a person with a disability',
    'i identify as having a disability',
  ],

  no: [
    'no',
    'no, i do not have a disability',
    'no i do not have a disability',
    'i do not have a disability',
    'i do not have a disability or a history of disability',
    'No, I do not have a disability and have not had one in the past',
  ],

  prefer_not_to_say: [
    'prefer not to say',
    'i choose not to disclose',
    'i do not wish to answer',
    'decline to answer',
    'i prefer not to disclose',
  ],
}
