import { createStyles } from '@mantine/core';

export const useStyles = createStyles((theme, _params, getRef) => ({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    rowGap: '20px',
    padding: '20px 0px 50px',
  },

  horizontalContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '750px',

    [theme.fn.smallerThan('sm')]: {
      width: '94vw',
    },
  },
}));
