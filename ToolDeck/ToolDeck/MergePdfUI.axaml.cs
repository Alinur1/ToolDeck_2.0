using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace ToolDeck;

public partial class MergePdfUI : UserControl
{
    private readonly MainWindow _main;
    public MergePdfUI()
    {
        InitializeComponent();
    }

    public MergePdfUI(MainWindow main) : this()
    {
        InitializeComponent();
        _main = main;
    }
}