# Testing Guide - Imbox AI Email Client

## Overview

This guide explains how to use the comprehensive testing system built into the Imbox AI Email Client. The testing system is designed to be non-technical friendly and provides visual dashboards for monitoring system health.

## Accessing the Testing Dashboard

1. Navigate to `/dashboard/dev-tools` in your browser
2. You'll see the **System Health Dashboard** with multiple sections

## Dashboard Sections

### 1. Overall System Health

- **Health Score**: 0-100 score showing overall system health
- **Status**: Excellent (90+), Good (75-89), Fair (60-74), Poor (40-59), Critical (<40)
- **Issues**: List of current problems
- **Recommendations**: How to fix issues

### 2. System Metrics

Real-time metrics showing:

- Active Users
- Total Emails
- Database Health
- Memory Usage
- Error Rate
- Sync Status

### 3. Automated Testing

- **Test Status**: Shows if automated tests are running
- **Start/Stop**: Control automated testing
- **Run Now**: Manually trigger tests
- **Success Rate**: Percentage of tests passing

### 4. Error Monitoring

- **Error Logs**: List of all application errors
- **Filtering**: Filter by level, category, status
- **Resolution**: Mark errors as resolved
- **Export**: Download error logs

### 5. Category Health Scores

Individual health scores for:

- **Database**: Schema, connections, data integrity
- **Authentication**: User login, sessions, security
- **Email System**: Send, receive, sync, storage
- **AI Features**: Summaries, replies, smart actions
- **Voice Messages**: Recording, playback, transcription
- **User Interface**: Components, themes, responsiveness

## Running Tests

### Manual Testing

1. Click **"Run All Tests"** button
2. Wait for tests to complete (usually 30-60 seconds)
3. Review results in the dashboard

### Automated Testing

1. Click **"Start Tests"** in the Automated Testing section
2. Tests will run automatically every 30 minutes
3. Monitor the Test Status Badge for current status

## Understanding Test Results

### Health Scores

- **90-100**: Excellent - Everything working perfectly
- **75-89**: Good - Minor issues, system stable
- **60-74**: Fair - Some problems, needs attention
- **40-59**: Poor - Multiple issues, system unstable
- **0-39**: Critical - Major problems, immediate action needed

### Test Categories

#### Database Tests

- **CRUD Operations**: Create, read, update, delete emails
- **Search Performance**: Email search and filtering speed
- **Data Consistency**: Check for duplicates and orphaned data
- **Storage Limits**: Monitor database size and performance

#### Email System Tests

- **Email Flow**: Complete email lifecycle testing
- **Sync Performance**: Email synchronization speed
- **Attachment Handling**: File upload and download
- **Search Functionality**: Email search capabilities

#### Voice Message Tests

- **Recording Quality**: Voice message recording
- **Playback Functionality**: Voice message playback
- **Transcription Accuracy**: Speech-to-text conversion
- **Format Support**: Audio format compatibility
- **Size Limits**: Voice message size validation
- **Security**: Voice message access controls

#### Sync Tests

- **Account Connectivity**: Email account connections
- **Sync Performance**: Data synchronization speed
- **Data Consistency**: Sync data integrity
- **Error Handling**: Sync failure recovery
- **Incremental Sync**: Delta synchronization
- **Rate Limits**: Sync frequency controls

## Error Monitoring

### Error Levels

- **Critical**: System-breaking errors requiring immediate attention
- **Error**: Application errors that need fixing
- **Warning**: Potential issues that should be monitored
- **Info**: Informational messages for debugging

### Error Categories

- **Database**: Database connection and query errors
- **Authentication**: Login and security issues
- **Email**: Email sending, receiving, and sync errors
- **AI**: AI feature and processing errors
- **Voice**: Voice message recording and playback errors
- **UI**: User interface and component errors
- **API**: API endpoint and integration errors
- **Sync**: Email synchronization errors

### Managing Errors

1. **View Errors**: Browse error logs with filtering
2. **Resolve Errors**: Mark errors as resolved
3. **Export Logs**: Download error data for analysis
4. **Search**: Find specific errors by message or component

## Best Practices

### Regular Monitoring

1. Check the dashboard daily
2. Run manual tests weekly
3. Keep automated testing enabled
4. Review error logs regularly

### When to Take Action

- **Health Score < 80**: Investigate and fix issues
- **Critical Errors**: Address immediately
- **High Error Rate**: Check system stability
- **Failed Tests**: Review test results and recommendations

### Troubleshooting

1. **Low Health Score**: Check issues and recommendations
2. **Test Failures**: Review specific test results
3. **High Error Count**: Filter errors by category
4. **Performance Issues**: Check system metrics

## Exporting Results

### Test Results

1. Click **"Export Results"** button
2. Download JSON file with complete test data
3. Share with development team if needed

### Error Logs

1. Use error monitoring export feature
2. Choose JSON or CSV format
3. Filter by date range or category

## Getting Help

### Common Issues

- **Database Issues**: Check database health score
- **Email Problems**: Review email system tests
- **Sync Issues**: Check sync performance tests
- **Voice Problems**: Review voice message tests

### Support

- Check the recommendations in each test result
- Review error logs for specific issues
- Export test results for technical support
- Monitor system metrics for performance issues

## Advanced Features

### Custom Test Schedules

- Modify test intervals in the test scheduler
- Enable/disable specific test categories
- Set up custom test combinations

### Error Alerting

- Critical errors trigger immediate notifications
- Health score drops below threshold alerts
- Test failure notifications

### Performance Monitoring

- Real-time system metrics
- Historical performance data
- Trend analysis and reporting

---

**Remember**: The testing system is designed to help you maintain a healthy, reliable email platform. Regular monitoring and quick response to issues will ensure optimal performance for your users.
