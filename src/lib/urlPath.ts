export const stripLeadingSlashes = (value: string): string => {
  let index = 0;
  while (value[index] === '/') {
    index += 1;
  }
  return value.slice(index);
};

export const stripTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') {
    end -= 1;
  }
  return value.slice(0, end);
};
