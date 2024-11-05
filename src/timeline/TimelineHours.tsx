import range from 'lodash/range';
import times from 'lodash/times';

import React, {useCallback, useMemo, useRef} from 'react';
import {View, Text, TouchableWithoutFeedback, ViewStyle, TextStyle, StyleSheet} from 'react-native';

import constants from '../commons/constants';
import {buildTimeString, calcTimeByPosition, calcDateByPosition} from './helpers/presenter';
import {buildUnavailableHoursBlocks, HOUR_BLOCK_HEIGHT, UnavailableHours} from './Packer';

interface NewEventTime {
  hour: number;
  minutes: number;
  date?: string;
}

export interface TimelineHoursProps {
  start?: number;
  end?: number;
  date?: string;
  format24h?: boolean;
  onBackgroundLongPress?: (timeString: string, time: NewEventTime) => void;
  onBackgroundLongPressOut?: (timeString: string, time: NewEventTime) => void;
  unavailableHours?: UnavailableHours[];
  unavailableHoursColor?: string;
  styles: {[key: string]: ViewStyle | TextStyle};
  width: number;
  numberOfDays: number;
  timelineLeftInset?: number;
  testID?: string;
}

const dimensionWidth = constants.screenWidth;
const EVENT_DIFF = 20;

// Adjust the interval height to account for 15-minute blocks
const QUARTER_HOUR_BLOCK_HEIGHT = HOUR_BLOCK_HEIGHT / 4;

const TimelineHours = (props: TimelineHoursProps) => {
  const {
    format24h,
    start = 0,
    end = 24,
    date,
    unavailableHours,
    unavailableHoursColor,
    styles,
    onBackgroundLongPress,
    onBackgroundLongPressOut,
    width,
    numberOfDays = 1,
    timelineLeftInset = 0,
    testID,
  } = props;

  const lastLongPressEventTime = useRef<NewEventTime>();

  // Generate unavailable hour blocks as usual
  const unavailableHoursBlocks = buildUnavailableHoursBlocks(unavailableHours, {dayStart: start, dayEnd: end});

  const hours = useMemo(() => {
    const times = [];
    for (let i = start; i <= end; i++) {
      for (let quarter = 0; quarter < 4; quarter++) {
        const minutes = quarter * 15;
        const hourString = i < 10 ? `0${i}` : `${i}`;
        const minuteString = minutes === 0 ? '00' : `${minutes}`;
        let timeText;

        if (i === start && minutes === 0) {
          timeText = '';
        } else if (!format24h) {
          const period = i < 12 || i === 24 ? 'AM' : 'PM';
          const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
          timeText = `${displayHour}:${minuteString} ${period}`;
        } else {
          timeText = `${hourString}:${minuteString}`;
        }
        times.push({ timeText, hour: i, minutes });
      }
    }
    return times;
  }, [start, end, format24h]);

  const handleBackgroundPress = useCallback(
    event => {
      const yPosition = event.nativeEvent.locationY;
      const xPosition = event.nativeEvent.locationX;
      const {hour, minutes} = calcTimeByPosition(yPosition, QUARTER_HOUR_BLOCK_HEIGHT);
      const dateByPosition = calcDateByPosition(xPosition, timelineLeftInset, numberOfDays, date);
      lastLongPressEventTime.current = {hour, minutes, date: dateByPosition};

      const timeString = buildTimeString(hour, minutes, dateByPosition);
      onBackgroundLongPress?.(timeString, lastLongPressEventTime.current);
    },
    [onBackgroundLongPress, date]
  );

  const handlePressOut = useCallback(() => {
    if (lastLongPressEventTime.current) {
      const {hour, minutes, date} = lastLongPressEventTime.current;
      const timeString = buildTimeString(hour, minutes, date);
      onBackgroundLongPressOut?.(timeString, lastLongPressEventTime.current);
      lastLongPressEventTime.current = undefined;
    }
  }, [onBackgroundLongPressOut, date]);

  return (
    <>
      <TouchableWithoutFeedback onLongPress={handleBackgroundPress} onPressOut={handlePressOut}>
        <View style={StyleSheet.absoluteFillObject} />
      </TouchableWithoutFeedback>
      {unavailableHoursBlocks.map((block, index) => (
        <View
          key={index}
          style={[
            styles.unavailableHoursBlock,
            block,
            unavailableHoursColor ? {backgroundColor: unavailableHoursColor} : undefined,
            {left: timelineLeftInset}
          ]}
        ></View>
      ))}

      {hours.map(({timeText, hour, minutes}, index) => {
        const topPosition = QUARTER_HOUR_BLOCK_HEIGHT * index;
        return (
          <React.Fragment key={`${hour}-${minutes}`}>
            <Text key={`timeLabel${hour}-${minutes}`} style={[styles.timeLabel, {top: topPosition - 6, width: timelineLeftInset - 16}]}>
              {timeText}
            </Text>
            {(hour !== start || minutes !== 0) && (
              <View
                key={`line${hour}-${minutes}`}
                testID={`${testID}.${hour}.${minutes}.line`}
                style={[styles.line, {top: topPosition, width: dimensionWidth - EVENT_DIFF, left: timelineLeftInset - 16}]}
              />
            )}
          </React.Fragment>
        );
      })}
      {times(numberOfDays, (index) => (
        <View key={index} style={[styles.verticalLine, {right: (index + 1) * width / numberOfDays}]} />
      ))}
    </>
  );
};

export default React.memo(TimelineHours);
