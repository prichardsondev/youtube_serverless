export const table = process.env.TABLE;
// Lambda supplies AWS_REGION. REGION remains an optional legacy override.
export const region = process.env.REGION || process.env.AWS_REGION;
