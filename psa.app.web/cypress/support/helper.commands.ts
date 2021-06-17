export function expectLocation(pathname: string) {
  return cy
    .location()
    .should((location) => expect(location.pathname).to.eq(pathname));
}

export function getRandomId(): number {
  return Math.floor(Math.random() * 10000000000);
}
