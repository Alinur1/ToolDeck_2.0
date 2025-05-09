using Avalonia.Controls;

namespace ToolDeck
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            MainContent.Content = new HomeUI(this);
        }
        public void NavigateTo(UserControl control)
        {
            MainContent.Content = control;
        }
    }
}