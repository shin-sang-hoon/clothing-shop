import { http } from "./http";

export type UpdateProfileRequest = {
  name?: string;
  phoneNumber?: string;
  zipCode?: string;
  roadAddress?: string;
  detailAddress?: string;
};

export type ChangeMyPasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function apiUpdateMyProfile(req: UpdateProfileRequest): Promise<void> {
  await http.patch("/me/profile", req);
}

export type MyProfileResponse = {
  name: string;
  nickname: string;
  phoneNumber: string;
  zipCode: string;
  roadAddress: string;
  detailAddress: string;
};

export async function apiUpdateMyNickname(nickname: string): Promise<void> {
  await http.patch("/me/nickname", { nickname });
}

export async function apiGetMyProfile(): Promise<MyProfileResponse> {
  const res = await http.get<MyProfileResponse>("/me/profile");
  return res.data;
}

export async function apiChangeMyPassword(req: ChangeMyPasswordRequest): Promise<void> {
  await http.patch("/me/password", req);
}

export async function apiGetLinkedSocialAccounts(): Promise<string[]> {
  const res = await http.get<string[]>("/me/social-accounts");
  return res.data;
}

export async function apiUnlinkSocialAccount(provider: string): Promise<void> {
  await http.delete(`/me/social-accounts/${provider}`);
}
