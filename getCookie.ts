export const getCookie = (request: Request, key: string) => {
  const cookiesObject = request.headers
    .get("Cookie")
    ?.split(";")
    .filter((x) => x.includes("="))
    .map((x) => x.trim().split("=") as [string, string])
    .reduce(
      (previous, [key, value]) => ({ ...previous, [key]: value }),
      {} as { [key: string]: string },
    );
  // console.log({ cookiesObject });
  const cookie = cookiesObject?.[key];
  if (!cookie) {
    return;
  }
  return decodeURIComponent(cookie);
};
