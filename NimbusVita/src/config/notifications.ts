import Toast from 'react-native-toast-message';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationParams {
  title: string;
  description: string;
}

export const useNotifications = () => {
  const notify = (type: NotificationType, options: { params: NotificationParams }) => {
    const { title, description } = options.params;
    
    Toast.show({
      type: type === 'warning' ? 'info' : type,
      text1: title,
      text2: description,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    });
  };

  return { notify };
};

// Export Toast component to be used in App.tsx
export { default as ToastComponent } from 'react-native-toast-message';
