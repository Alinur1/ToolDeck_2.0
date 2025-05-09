using Avalonia;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Markup.Xaml;

namespace ToolDeck;

public partial class HomeUI : UserControl
{
    private readonly MainWindow _main;
    public HomeUI()
    {
        InitializeComponent();
    }
    public HomeUI(MainWindow main) : this()
    {
        InitializeComponent();
        _main = main;
    }

    private void GoToMergePDF(object sender, RoutedEventArgs e)
    {
        _main.NavigateTo(new MergePdfUI(_main));
    }
}