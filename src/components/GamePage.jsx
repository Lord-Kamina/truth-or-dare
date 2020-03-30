import React, { useState, useEffect, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Typography, Button } from '@material-ui/core';
import { SubdirectoryArrowLeft, SubdirectoryArrowRight } from '@material-ui/icons';
import { OptionsContext } from '../context/OptionsContext';
import Spinner from './Shared/Spinner';
import firebase from '../config/firebase';
import PlayersScore from './Players/PlayersScore';
import { storeSetTruthQuestions, 
  storeGetTruthQuestions, 
  storeSetDareQuestions, 
  storeGetDareQuestions,
  storeGetQuestionType,
  storeSetQuestionType,
  storeGetCurrentQuestion,
  storeSetCurrentQuestion,
  storeRemoveQuestionType,
  storeRemoveCurrentQuestion 
} from '../config/store';

const useStyles = makeStyles(theme => ({
  root: {
    textAlign: 'center'
  },
  paper: {
    margin: theme.spacing(2),
    padding: theme.spacing(2)
  },
  button: {
    margin: theme.spacing(2)
  },
  qType: {
    textTransform: 'capitalize'
  },
  question: {
    margin: theme.spacing(2, 0)
  },
  error: {
    color: 'red'
  }
}));

function GamePage() {
  const classes = useStyles();
  const { category, playerName, nextPlayer, scoreUpdate } = useContext(
    OptionsContext
  );
  const [isTruthOver, setTruthOver] = useState(false);
  const [isDareOver, setDareOver] = useState(false);
  const [questionType, setQuestionType] = useState(storeGetQuestionType() || null);
  const [currentQuestion, setCurrentQuestion] = useState(storeGetCurrentQuestion() || null);
  const [truth, setTruth] = useState(storeGetTruthQuestions() || []);
  const [dare, setDare] = useState(storeGetDareQuestions() || []);
  const [state, setState] = useState({
    loading: false,
    error: null
  });

  useEffect(() => {
    async function fetchData() {
      setState({ loading: true, error: null });
      
      try {
        const t = await firebase.firestore().collection('truth_questions').get();
        const d = await firebase.firestore().collection('dare_questions').get();

        setTruth(t.docs.map(doc => doc.data()).filter(t => t.category === category));
        setDare(d.docs.map(doc => doc.data()).filter(d => d.category === category));

        setState({ loading: false, error: null });
      } catch (err) {
        console.error(err.message);
        setState({ loading: false, error: err.message });
      }
    }
    
    if (truth.length <= 0 || dare.length <= 0) {
      fetchData();
    }
  }, [category, truth, dare]);

  function handlePlayerTurn(update) {
    if (update === 'update') {
      scoreUpdate(questionType);
    } else {
      nextPlayer();
    }
    setQuestionType(null);
    setCurrentQuestion(null);
    storeRemoveQuestionType();
    storeRemoveCurrentQuestion();
  }

  function getRandomInt(max) {
    return Math.floor(Math.random() * max.length);
  }

  function handleRandomTruth() {
    const remainingTruth = truth.filter(t => !t.appeared);
    const randomNum = getRandomInt(remainingTruth);

    if (remainingTruth.length > 0) {
      const question = remainingTruth[randomNum].question;

      setQuestionType('truth');
      storeSetQuestionType('truth');
      setCurrentQuestion(question);
      storeSetCurrentQuestion(question);
      remainingTruth[randomNum].appeared = true;
      storeSetTruthQuestions(truth);
    } else {
      setTruthOver(true);
    }
  }

  function handleRandomDare() {
    const remainingDare = dare.filter(d => !d.appeared);
    const randomNum = getRandomInt(remainingDare);

    if (remainingDare.length > 0) {
      const question = remainingDare[randomNum].question;

      setQuestionType('dare');
      storeSetQuestionType('dare');
      setCurrentQuestion(question);
      storeSetCurrentQuestion(question);
      remainingDare[randomNum].appeared = true;
      storeSetDareQuestions(dare);
    } else {
      setDareOver(true);
    }
  }

  function whatRender() {
    if (state.loading) {
      return <Spinner />;
    } else if (isTruthOver && isDareOver) {
      return <Typography variant="h4">Game over</Typography>;
    } else if (questionType && currentQuestion) {
      return (
        <>
          <Typography className={classes.qType}>{questionType}</Typography>
          <Typography variant="h6" className={classes.question}>
            {currentQuestion}
          </Typography>
        </>
      );
    } else if (state.error) {
      return (
        <Typography gutterBottom className={classes.error}>
          {state.error}
        </Typography>
      );
    } else {
      return (
        <Typography gutterBottom>
          {playerName
            ? `${playerName} select a question type!`
            : 'Select a question type!'}
        </Typography>
      );
    }
  }

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        {whatRender()}

        {currentQuestion && playerName ? (
          <>
            <Button
              size="large"
              color="secondary"
              variant="outlined"
              onClick={handlePlayerTurn}
              className={classes.button}
              startIcon={<SubdirectoryArrowLeft />}
            >
              Skip
            </Button>
            <Button
              size="large"
              color="primary"
              variant="outlined"
              className={classes.button}
              onClick={() => handlePlayerTurn('update')}
              endIcon={<SubdirectoryArrowRight />}
            >
              Next
            </Button>
          </>
        ) : (
            <>
              <Button
                size="large"
                color="primary"
                variant="contained"
                disabled={isTruthOver}
                className={classes.button}
                onClick={handleRandomTruth}
              >
                Truth
            </Button>
              <Button
                size="large"
                color="secondary"
                variant="contained"
                disabled={isDareOver}
                className={classes.button}
                onClick={handleRandomDare}
              >
                Dare
            </Button>
            </>
          )}
      </Paper>
      {playerName ? <PlayersScore /> : null}
    </div>
  );
}

export default GamePage;
