import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
type BackButtonProps = {
  onClick: () => void;
  heading: string;
};

const BackButton = ({ onClick, heading }: BackButtonProps) => {
  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent={'space-between'}
      alignItems="center"
      className='top-headers'
    >
      <IconButton
        aria-label="back"
        size="small"
        onClick={onClick}
      >
        <ChevronLeftIcon />
      </IconButton>

      <Typography
        textAlign={'center'}
        fontWeight="600"
        fontFamily="Poppins"
        sx={{ cursor: "default" }}
      >
        {heading}
      </Typography>
      <Box></Box>
    </Box>
  );
};

export default BackButton;
