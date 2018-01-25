/* eslint-disable */

/**
 * Asserts that the error message is revert
 * @param {Error} err
 */
const assertRevert = (err) => {
  assert.equal(err.message,
    "VM Exception while processing transaction: revert");
}

const timestampWithOffset = (hoursOffset) => {
  let t = new Date()
  t.setHours(t.getHours() + hoursOffset)
  return Math.round(t.getTime() / 1000)
}

module.exports = {
  assertRevert,
  timestampWithOffset,
}
