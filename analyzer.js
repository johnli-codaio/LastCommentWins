'use strict';

const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');

const comment1Json = require('./LastComment1.json');
const comment2Json = require('./LastComment2.json');
const comment3Json = require('./LastComment3.json');
const comment4Json = require('./LastComment4.json');

// console.log(comment1Json);
// console.log(comment2Json);
// console.log(comment3Json);
// console.log(comment4Json);

// We have four files, makes it quicker to aggregate them via code rather than manually.
function aggregateComments() {
  return _.concat(
    comment1Json.data,
    comment2Json.data,
    comment3Json.data,
    comment4Json.data
  );
}

// Will grab comment array to produce a map of names with respective winning times
// and number of times they posted.
function calculateWinningTimes(commentArray) {

  // Names will be keys. Values will include winning times and number of comments.
  const mapOfNames = {};
  let prevObj;


  // Operates like Haskell foldr. Accumulator will be mapOfNames.
  return _.reduce(commentArray, (accumulator, commentObj) => {
    const commentAuthor = commentObj.from.name;

    // _.get will prevent undefined reference errors
    const prevAuthor = _.get(prevObj, 'from.name');

    if (_.isNil(accumulator[commentAuthor])) {
      accumulator[commentAuthor] = {
        totalWinningTime: 0,
        totalComments: 0
      };

      // Edge case for first element
      if (!_.isNil(prevObj)) {
        const prevCreatedTimeUTC = moment(prevObj.created_time).unix();
        const currCreatedTimeUTC = moment(commentObj.created_time).unix();
        accumulator[prevAuthor].totalWinningTime += currCreatedTimeUTC - prevCreatedTimeUTC;
      }
    }

    if (_.isEqual(prevAuthor, commentAuthor)) {
      accumulator[commentAuthor].totalComments++;
    }

    else if (_.isNil(prevObj)) {
      accumulator[commentAuthor].totalComments++;
      prevObj = _.cloneDeep(commentObj);
    }

    else if (_.isEqual(commentObj, _.last(commentArray))) {
      accumulator[commentAuthor].totalComments++;

      const currCreatedTimeUTC = moment(commentObj.created_time).unix();
      accumulator[commentAuthor].totalWinningTime += moment().unix() - currCreatedTimeUTC;
    }

    else {
      accumulator[commentAuthor].totalComments++;

      const prevCreatedTimeUTC = moment(prevObj.created_time).unix();
      const currCreatedTimeUTC = moment(commentObj.created_time).unix();
      accumulator[prevAuthor].totalWinningTime += currCreatedTimeUTC - prevCreatedTimeUTC;

      prevObj = _.cloneDeep(commentObj);
    }

    return accumulator;

  }, mapOfNames);
}

function printStatistics(commentObjs, commentAuthors) {
  _.each(commentAuthors, author => {
    const printString = `${author}:\n
        Winning Time (in seconds): ${commentObjs[author].totalWinningTime}
        Total Comments: ${commentObjs[author].totalComments}\n\n
    `;
    fs.appendFileSync('results.txt', printString);

  });
}

function main() {
  const allComments = aggregateComments();
  const sortedComments = _.sortBy(allComments, ['created_time']);
  const winningTimes = calculateWinningTimes(sortedComments);
  const sortedWinningKeys = _.sortBy(_.keys(winningTimes), key => {
    // Reversed to allow for descending sort.
    return -winningTimes[key].totalWinningTime;
  });

  printStatistics(winningTimes, sortedWinningKeys);
}

main();


