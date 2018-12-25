export const clamp = (num, start = 0, end = Number.MIN_SAFE_INTEGER) => {
  if (num < start) {
    return start;
  }

  if (num > end) {
    return end;
  }

  return num;
};
