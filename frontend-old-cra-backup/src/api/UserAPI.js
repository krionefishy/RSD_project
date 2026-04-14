import { mockCurrentUser, mockUserStatus, mockAchievements } from "../mock/user";

// Mock API for user operations (no backend connection)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class UserAPIClass {
  async fetchUserInfo() {
    await delay(400);
    return { ...mockCurrentUser };
  }

  async fetchUserStatus() {
    await delay(200);
    return { ...mockUserStatus };
  }

  async fetchUserAchieves() {
    await delay(300);
    return [...mockAchievements];
  }

  async updateUserInfo(userId, data) {
    await delay(400);
    return {
      success: true,
      user: { ...mockCurrentUser, ...data },
    };
  }

  async uploadProfilePhoto(file) {
    await delay(500);
    return {
      profile_photo_url: "https://via.placeholder.com/150",
    };
  }

  async deleteProfilePhoto() {
    await delay(300);
    return { success: true };
  }
}

const UserAPI = new UserAPIClass();
export default UserAPI;
