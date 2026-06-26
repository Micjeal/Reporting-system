# Project Structure

## Folder Organization

### `/docs`
Contains all project documentation files (.md)
- Technical documentation
- Feature specifications
- Bug reports and fixes
- Implementation guides

### `/migrations`
Contains all database migration files (.sql)
- Sequential numbered migrations
- Schema changes
- Data migrations
- Database fixes

### Other Key Folders
- `/app` - Next.js application pages and routes
- `/components` - React components
- `/lib` - Utility functions and shared code
- `/services` - Business logic and API services
- `/hooks` - Custom React hooks
- `/.kiro/specs` - Kiro AI specifications and tasks

## Best Practices

1. **Documentation**: Place all .md files in `/docs` folder
2. **Migrations**: Place all .sql files in `/migrations` folder with sequential numbering
3. **Keep root clean**: Avoid placing documentation or SQL files in the project root
4. **Update READMEs**: Update folder READMEs when adding new files
