import { createStyles } from '@mantine/core';

export const useStyles = createStyles((theme, _params, getRef) => ({
  card: {
    borderRadius: '7px',
    boxShadow: `0px 0px 8px 0px ${theme.colors.gray[4]}`,
    padding: '20px',
    width: '750px',

    [theme.fn.smallerThan('sm')]: {
      width: '94vw',
    },
  },
}));
