import { createStyles } from '@mantine/core';

export const useStyles = createStyles((theme, _params, getRef) => ({
  horizontalContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  horizontalContainerMain: {
    display: 'box',
    alignItems: 'left',
    justifyContent: 'space-between',
    width: '100%',
  },

  verticalContainerLeft: {
    display: 'box',
    float: 'left',
    alignItems: 'left',
    justifyContent: 'space-between',
    width: '45%',
  },

  verticalContainerRight: {
    display: 'box',
    float: 'right',
    alignItems: 'right',
    justifyContent: 'space-between',
    width: '45%',
  },

  horizontalContainerRight: {
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'end',
  },
  guessesContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    rowGap: '12px',
  },
}));
