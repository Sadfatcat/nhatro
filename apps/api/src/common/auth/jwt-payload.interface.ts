export interface JwtPayload {
  sub:    string;
  role:   string;
  roomId?: string;
}

export interface RequestUser {
  id:     string;
  role:   string;
  roomId?: string;
}
