import { useNavigate } from "react-router";

export const useAnimatedNavigate = () => {
  const navigate = useNavigate();

  return (to, options = {}) => {
    navigate(to, options);
  };
};
