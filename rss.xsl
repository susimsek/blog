<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:media="http://search.yahoo.com/mrss/">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <xsl:variable name="isTr" select="starts-with(normalize-space(rss/channel/language), 'tr')"/>
    <xsl:variable name="htmlLang">
      <xsl:choose>
        <xsl:when test="$isTr">tr</xsl:when>
        <xsl:otherwise>en</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="labelLastBuildDate">
      <xsl:choose>
        <xsl:when test="$isTr">Son Güncelleme Tarihi:</xsl:when>
        <xsl:otherwise>Last Build Date:</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="labelTotalItems">
      <xsl:choose>
        <xsl:when test="$isTr">Toplam İçerik:</xsl:when>
        <xsl:otherwise>Total Items:</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="labelCategories">
      <xsl:choose>
        <xsl:when test="$isTr">Kategoriler:</xsl:when>
        <xsl:otherwise>Categories:</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <html xmlns="http://www.w3.org/1999/xhtml" lang="{$htmlLang}">
      <head>
        <title><xsl:value-of select="rss/channel/title"/></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: Helvetica, Arial, sans-serif;
            background: #f9f9f9;
            margin: 0;
            padding: 20px;
          }
          #content {
            max-width: 800px;
            margin: auto;
            background: #fff;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          h1 {
            font-size: 24px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .item {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
            overflow: auto;
          }
          .item-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .item-title a {
            text-decoration: none;
            color: #0077cc;
          }
          .item-title a:hover {
            text-decoration: underline;
          }
          .pubDate {
            font-size: 12px;
            color: #888;
            margin-bottom: 5px;
          }
          .description {
            margin: 10px 0;
            font-size: 14px;
            line-height: 1.4;
          }
          .categories {
            font-size: 12px;
            color: #555;
          }
          .thumbnail {
            float: right;
            margin-left: 10px;
          }
          .thumbnail img {
            max-width: 120px;
            max-height: 120px;
            border: 1px solid #ccc;
          }
          .footer {
            font-size: 14px;
            color: #333;
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div id="content">
          <h1><xsl:value-of select="rss/channel/title"/></h1>
          <p><xsl:value-of select="rss/channel/description"/></p>
          <p><strong><xsl:value-of select="$labelLastBuildDate"/></strong> <xsl:value-of select="rss/channel/lastBuildDate"/></p>
          <p><strong><xsl:value-of select="$labelTotalItems"/></strong> <xsl:value-of select="count(rss/channel/item)"/></p>
          <xsl:for-each select="rss/channel/item">
            <div class="item">
              <xsl:if test="media:thumbnail">
                <div class="thumbnail">
                  <img src="{media:thumbnail/@url}" alt="{title}" />
                </div>
              </xsl:if>
              <div class="item-title">
                <a href="{link}">
                  <xsl:value-of select="title"/>
                </a>
              </div>
              <div class="pubDate">
                <xsl:value-of select="pubDate"/>
              </div>
              <div class="description">
                <xsl:value-of select="description"/>
              </div>
              <div class="categories">
                <strong><xsl:value-of select="$labelCategories"/></strong>
                <xsl:for-each select="category">
                  <span>
                    <xsl:value-of select="."/>
                    <xsl:if test="position() != last()">, </xsl:if>
                  </span>
                </xsl:for-each>
              </div>
            </div>
          </xsl:for-each>
          <div class="footer">
            <xsl:value-of select="rss/channel/copyright"/>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
