const initialState = {
  isUser: false,
  isAdmin: false,
  isSuperAdmin: false,
  loaded: false,
};

const statusReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_USER_STATUS":
      return {
        ...state,
        ...action.payload,
        loaded: true,
      };
    case "CLEAR_STATUS":
      return initialState;
    default:
      return state;
  }
};

export default statusReducer;
