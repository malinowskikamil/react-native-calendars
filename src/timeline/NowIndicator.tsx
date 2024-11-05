import React, {useMemo} from 'react';
import {View, TextStyle, ViewStyle} from 'react-native';
import {calcTimeOffset} from './helpers/presenter';
import {HOUR_BLOCK_HEIGHT} from './Packer';

export interface NowIndicatorProps {
  styles: {[key: string]: ViewStyle | TextStyle};
  width: number;
  left: number;
  start: number;
}

const NowIndicator = (props: NowIndicatorProps) => {
  const {start, styles, width, left} = props;
  const now = new Date();
  const hour = now.getHours() - start;
  const minutes = now.getMinutes();
  const indicatorPosition = calcTimeOffset(HOUR_BLOCK_HEIGHT, hour, minutes);

  const nowIndicatorStyle = useMemo(() => {
    return [styles.nowIndicator, {top: indicatorPosition, left}];
  }, [indicatorPosition, left]);

  return (
    <View style={nowIndicatorStyle}>
      <View style={[styles.nowIndicatorLine, {width}]}/>
      <View style={styles.nowIndicatorKnob}/>
    </View>
  );
};

export default NowIndicator;
