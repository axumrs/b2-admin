export class FetchException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export class UnauthorizedException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}
