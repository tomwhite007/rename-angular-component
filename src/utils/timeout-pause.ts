export const timeoutPause = async (wait = 0) => {
  await new Promise((res) => setTimeout(res, wait));
  return;
};
