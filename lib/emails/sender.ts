/**
 * Where replies go.
 *
 * Every email was sent from noreply@ with no Reply-To at all. That is one of
 * the signals Gmail reads as bulk mail rather than correspondence, and it is
 * also just wrong: a student replying to "an employer tried to contact you"
 * should reach a person, not a black hole.
 */
export const REPLY_TO = process.env.EMAIL_REPLY_TO || "simplyapplyapp@gmail.com"
