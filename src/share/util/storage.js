export async function getMp4Url() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["mp4Url"], (res) => {
      resolve(res?.mp4Url ?? null);
    });
  });
}
