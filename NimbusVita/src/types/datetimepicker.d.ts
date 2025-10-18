declare module '@react-native-datetimepicker/datetimepicker' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export type DateTimePickerEvent = {
    type: 'set' | 'dismissed' | string;
    nativeEvent: { timestamp?: number };
  };

  const DateTimePicker: ComponentType<
    ViewProps & {
      value: Date;
      mode?: 'date' | 'time' | 'datetime';
      display?: 'default' | 'spinner' | 'calendar' | 'clock';
      onChange?: (event: DateTimePickerEvent, date?: Date) => void;
      maximumDate?: Date;
    }
  >;

  export default DateTimePicker;
}
