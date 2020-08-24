import React from 'react';
import {
  Container,
  Paper,
  Box,
  Divider,
  ButtonBase,
  NoSsr,
  Modal,
  Fade,
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';
import { compose, palette, sizing } from '@material-ui/system';

const TopDivider = styled(Divider)(compose(palette));

const FullSizePaper = styled(Paper)(compose(sizing));

export function ModalContainer(props: {
  children: React.ReactNode;
  closeHandler: () => void;
}) {
  return (
    <Box margin="24px" height="calc(100% - 49px)" width="calc(100% - 49px)">
      <FullSizePaper elevation={5} height="100%">
        <Box
          display="flex"
          flexDirection="row-reverse"
          alignItems="center"
          padding="8px"
        >
          <ButtonBase onClick={props.closeHandler}>
            <Box
              border={1}
              borderColor="text.primary"
              display="flex"
              alignItems="center"
              borderRadius={3}
            >
              <Close />
            </Box>
          </ButtonBase>
        </Box>
        <TopDivider bgcolor="text.primary" />
        <Container>{props.children}</Container>
      </FullSizePaper>
    </Box>
  );
}

export const Render: React.FC<{ if_true: boolean }> = ({
  if_true,
  children,
}) => {
  return <div>{if_true ? children : null}</div>;
};

export default function ChildPopup(props: {
  children: React.ReactNode;
  closeHandler: () => void;
  open: boolean;
}) {
  return (
    <NoSsr>
      <Modal
        open={props.open}
        onClose={props.closeHandler}
        closeAfterTransition
      >
        <Fade in={props.open}>
          <ModalContainer closeHandler={props.closeHandler}>
            <Render if_true={props.open}>{props.children}</Render>
          </ModalContainer>
        </Fade>
      </Modal>
    </NoSsr>
  );
}
