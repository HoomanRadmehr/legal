export type InvitationAcceptInput = {
  password: string;
  password_confirm: string;
  token: string;
};

export type InvitationAcceptResponse = {
  status: string;
};
