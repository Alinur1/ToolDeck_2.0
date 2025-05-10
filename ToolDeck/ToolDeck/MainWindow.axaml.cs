using Avalonia.Controls;
using System;
using System.Collections.Generic;

namespace ToolDeck
{
    public partial class MainWindow : Window
    {
        private readonly Dictionary<string, UserControl> _views = new();
        public MainWindow()
        {
            InitializeComponent();
            MainContent.Content = new HomeUI(this);
        }
        public void NavigateTo(string viewName)
        {
            if(!_views.ContainsKey(viewName))
            {
                _views[viewName] = viewName switch
                {
                    "HomeUI" => new HomeUI(this),
                    "MergePdfUI" => new MergePdfUI(this),
                    _ => throw new ArgumentException("Unknow view")
                };
            }

            MainContent.Content = _views[viewName];
        }
    }
}