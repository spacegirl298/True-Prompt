const ethicalWeights = {
  thirdPartyConsent: 0.15,
  privacy: 0.15,
  fairness: 0.15,
  harm: 0.15,
  deception: 0.1,
  harmfulContent: 0.15,
  exploitation: 0.1,
  labourDisplacement: 0.05,
};

const socialWeights = {
  parasocial: 0.25,
  judgement: 0.1,
  isolation: 0.25,
  skillLoss: 0.2,
  frequency: 0.2,
};

const politicalWeights = {
  persuasion: 0.12,
  democracy: 0.12,
  propaganda: 0.12,
  misinformation: 0.12,
  surveillance: 0.1,
  profiling: 0.1,
  governance: 0.08,
  powerConcentration: 0.08,
  inequality: 0.08,
  monetarySupport: 0.08,
};

const authorshipWeights = {
  styleMimicry: 0.15,
  creativeLabour: 0.15,
  factualSynthesis: 0.05,
  dependencySignal: 0.1,
  academicIntegrity: 0.15,
  creativeAuthorship: 0.15,
  personalIdentity: 0.1,
  humanDisplacement: 0.15,
};

export const dimensionWeights = {
  ethical: ethicalWeights,
  social: socialWeights,
  political: politicalWeights,
  authorship: authorshipWeights,
};