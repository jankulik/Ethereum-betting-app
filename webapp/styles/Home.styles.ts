import { createStyles } from "@mantine/core"

export const useStyles = createStyles((theme, _params, getRef) => ({
  wrapper: {
    // width: '100%',
    // height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    rowGap: '20px',
    padding: '20px 0px 50px',
  },
  
  rectangle: {
    height: 'fit-content',
    padding: '1rem 1rem',
    boxShadow: '0px 0px 0.4rem grey',
    borderRadius: '0.2rem',
    width: '600px',

    [theme.fn.smallerThan('sm')]: {
      width: '92vw',
    },
  },
}));
