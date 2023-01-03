import { createStyles } from '@mantine/core';

export const useStyles = createStyles((theme, _params, getRef) => ({
  horizontalContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  checkBoxContainer: {
    paddingLeft: '10px',
    paddingTop: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '35%',
  },

  verticalContainer: {
    display: 'box',
    justifyContent: 'space-between',
    width: '100%',
  },

  columnWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    rowGap: '12px',
  }
}));
