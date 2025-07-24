import { Box, Typography } from "@mui/material";
import Secure from "../assets/secureAuth.svg";

const NotAuthenticated = () => {
  return (
    <Box
      sx={{
        height: "90vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        component="img"
        src={Secure}
        alt="Secure Authentication"
        sx={{ maxWidth: "200px", mb: 2 }}
      />
      <Typography textAlign="center" color="black" fontWeight={500} fontSize="25px" fontFamily={'Poppins'}>
        Not Authenticated
      </Typography>
    </Box>
  );
};

export default NotAuthenticated;
