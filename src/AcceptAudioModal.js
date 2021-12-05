import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const style = {
    position: "absolute",
    top: "25%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 200,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
};

export default function AcceptAudioModal(props) {
    const { audioElem, setAcceptAudio } = props;
    const [open, setOpen] = React.useState(true);
    const handleClose = () => setOpen(false);

    const onAccept = () => {
      audioElem.current.play().catch(error => console.log(error));
      setAcceptAudio(true);
      handleClose();
    }

    return (
        <div>
            <Modal
                open={open}
                // onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    {/* <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Duis mollis, est non commodo luctus, nisi erat porttitor
                        ligula.
                    </Typography> */}
                    <Button onClick={onAccept}>Connect to Audio</Button>
                </Box>
            </Modal>
        </div>
    );
}
